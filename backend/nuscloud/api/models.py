from django.db import models
from django.utils import timezone
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.utils.translation import ugettext_lazy as _

import datetime


class ModuleManager(models.Manager):
    use_in_migrations = True

    def create(self, module_code):
        module = self.model(module_code=module_code)
        module.save()
        return module

    def create_if_not_exist(self, module_code):
        module = self.filter(module_code=module_code).first()
        if not module:
            module = self.create(module_code)
        return module


class Module(models.Model):
    module_code = models.CharField(max_length=150, primary_key=True,
                                   unique=True, editable=False)
    last_updated = models.DateTimeField(default=timezone.make_aware(datetime.datetime.min))

    objects = ModuleManager()


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, ivle_user_id, name, email, ivle_token, synced_modules, **kwargs):
        """
        Creates and saves a User with the given ivle_user_id and ivle_token.
        """
        if not ivle_user_id:
            raise ValueError('The given ivle_user_id must be set.')
        user = self.model(
            ivle_user_id=ivle_user_id,
            name=name,
            email=email,
            ivle_token=ivle_token,
            **kwargs
        )
        user.save()

        # TODO Set expiry date properly
        for module in synced_modules:
            module_obj = Module.objects.create_if_not_exist(module)
            user.taking_modules.add(module_obj)
            user.synced_modules.add(module_obj)

        user.save()
        return user

    def create_user(self, ivle_user_id, name, email, ivle_token, synced_modules, **kwargs):
        kwargs.setdefault('is_staff', False)
        kwargs.setdefault('is_superuser', False)
        return self._create_user(ivle_user_id, name, email, ivle_token, synced_modules, **kwargs)

    def create_superuser(self, ivle_user_id, name, email, ivle_token, synced_modules, **kwargs):
        kwargs.setdefault('is_staff', True)
        kwargs.setdefault('is_superuser', True)

        if kwargs.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if kwargs.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(ivle_user_id, name, email, ivle_token, synced_modules, **kwargs)


class User(AbstractBaseUser, PermissionsMixin):
    ivle_user_id = models.CharField(max_length=100, primary_key=True, null=False,
                                    unique=True, editable=False)
    name = models.CharField(max_length=250)
    email = models.EmailField(max_length=255)

    ivle_token = models.CharField(max_length=600)
    ivle_expiry = models.DateTimeField(default=timezone.now)
    taking_modules = models.ManyToManyField(Module, related_name='users_taking')
    synced_modules = models.ManyToManyField(Module, related_name='synced_users')
    last_updated = models.DateTimeField(default=timezone.make_aware(datetime.datetime.min))

    # Cloud storage tokens
    dropbox_token = models.CharField(max_length=500, null=True)

    box_access_token = models.CharField(max_length=2000, null=True)
    box_refresh_token = models.CharField(max_length=2000, null=True)

    gdrive_token = models.CharField(max_length=500, null=True)
    gdrive_expiry = models.DateTimeField(default=timezone.now)

    onedrive_access_token = models.CharField(max_length=2000, null=True)
    onedrive_refresh_token = models.CharField(max_length=2000, null=True)

    sync_status = models.BooleanField(default=False)
    last_synced = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_('Designates whether the user can log into this admin site.'),
    )

    USERNAME_FIELD = 'ivle_user_id'
    EMAIL_FIELD = 'email'

    objects = UserManager()

