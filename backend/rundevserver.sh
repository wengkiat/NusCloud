# modify database scheme according to the change of models.py
python nuscloud/manage.py makemigrations

# apply above migrations
python nuscloud/manage.py migrate

if [ $# -ge 1 ]; then
    ./nuscloud/manage.py runserver 0.0.0.0:$1  # run Django development server on specify port
else
    ./nuscloud/manage.py runserver 0.0.0.0:8000  # run Django development server on default port 8080
fi

