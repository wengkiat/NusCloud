import React, { Component } from 'react'
import { Button, Message, Form, Input, Icon, TextArea, Divider, Header, Container } from 'semantic-ui-react'
import styles from '../styles/Contact.module.css'
import header_styles from '../styles/Header.module.css'
import PageHeader from './Header.js';
import {getEmailjsKey} from './config.js'
import axios from 'axios';
import Fade from 'react-reveal/Fade';
import Footer from './Footer';

class ContactForm extends Component {
    state = {
        firstname: '',
        lastname: '',
        email: '',
        feedback: '',
        emailError: false,
        success: false,
        failure: false
    }
  
    handleChange = (e, { value }) => this.setState({ value })
    
    handleSubmit = (e) => {
        e.preventDefault();
        if (this.state.email.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/)) {
            this.setState({emailError: false});

        } else {
            this.setState({emailError: true});
            return;
        } 
        
        axios.post("https://api.emailjs.com/api/v1.0/email/send", {
            "service_id": "gmail",
            "template_id": "contactform",
            "user_id": getEmailjsKey(),
            "template_params": {
                "name": this.state.firstname + " " + this.state.lastname,
                "email": this.state.email,
                "subject": "NUSCloud Feedback",
                "message": this.state.feedback
            }
        }).then(body => {
            // console.log("body", body);
            if (body.data === "OK") {
                this.setState({
                    success: true,
                    firstname: '',
                    lastname: '',
                    email: '',
                    feedback: '',
                });
            }
        }).catch((e) => {
            // console.log(e);
            this.setState({failure: true});
        });

        console.log(this.state);
    }

    onEmailChange = (e) => {
        this.setState({ email: e.target.value});
    }

    onFirstNameChange = (e) => {
        this.setState({ firstname: e.target.value});
    }

    onLastNameChange = (e) => {
        this.setState({ lastname: e.target.value});
    }

    onFeedbackChange = (e) => {
        this.setState({ feedback: e.target.value});
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        let elem = Array.from(document.getElementsByClassName(header_styles.contact))[0];
        elem.click();
    }

    render() {
        return (
            <div>
                <PageHeader login={!!localStorage.getItem("access_token")} able={true}/>
                <div className={styles.container}>
                    <Fade>
                        <Container text>
                            <div className={styles.firstSection}>
                                <Header className={styles.header}>
                                    <Icon name='chat' />
                                    Talk to Us
                                </Header>
                                <Divider hidden />
                                We welcome your suggestions, feedbacks or ideas which will help us bring a better experience for the NUS community. We will get back to you as soon as possible (within 5 working days)!
                                <Divider hidden />

                                <div className={styles.contacts}>
                                    <Button inverted color='blue' onClick={() => {window.open("https://www.facebook.com/nuscloud/", "_blank")}} className={styles.button}>
                                        Facebook
                                    </Button>
                                    <Button inverted color='blue' onClick={() => {window.open("https://twitter.com/nuscloud/", "_blank")}} className={styles.button}>
                                        Twitter
                                    </Button>
                                    <Button inverted color='blue' onClick={() => {window.open("https://github.com/NUSCloud", "_blank")}} className={styles.button}>
                                        Github
                                    </Button>
                                    <Button inverted color='blue' onClick={() => window.location = "mailto:nuscloudz@gmail.com?Subject=NUSCloud%20Feedback"} className={styles.button}>
                                        Email
                                    </Button>
                                </div>
                            </div>
                            <Divider />
                            <Header size='large'>
                                Or Fill Up This Form
                            </Header>

                            {this.state.emailError && (
                                <Message error header="Invalid Email" content="Please input a valid email"/>
                            )}

                            <Form className={styles.form} onSubmit={(event) => {this.handleSubmit(event);}}>
                                <Form.Group widths='equal'>
                                    <Form.Field required control={Input} label='First name' name="firstname" placeholder='First name' value={this.state.firstname} onChange={this.onFirstNameChange}/>
                                    <Form.Field control={Input} label='Last name' name="lastname" placeholder='Last name' value={this.state.lastname} onChange={this.onLastNameChange}/>
                                </Form.Group>
                                <Form.Field required control={Input} label='Email' name="email" placeholder='Email' value={this.state.email} onChange={this.onEmailChange} error={this.state.emailError}/>
                                <Form.Field required control={TextArea} label='Feedback' name="feedback" placeholder='Enter your feedback...' value={this.state.feedback} onChange={this.onFeedbackChange}/>
                                <Form.Field control={Button} primary inverted type="submit">Submit</Form.Field>
                            </Form>
                            <Divider hidden />

                            {this.state.success && (
                                <Container text className={styles.message}>
                                    <Message success>
                                        Feedback successfully sent!
                                    </Message>
                                    <Divider hidden />
                                </Container>
                            )}
                            {this.state.failure && (
                                <Container text className={styles.message}>
                                    <Message error>
                                        Error - Please try again later!
                                    </Message>
                                    <Divider hidden />
                                </Container>
                            )}
                        </Container>
                    </Fade>
                </div>
                <Footer />
            </div>
        )
    }
}
  
  export default ContactForm
  