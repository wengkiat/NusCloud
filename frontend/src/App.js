import React from 'react';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import UserView from './components/UserView';
import About from './components/About';
import Contact from './components/Contact';
import FAQ from './components/FAQ';
import NotFoundPage from './components/NotFoundPage';
import IVLERedirect from './components/IVLERedirect';
import DropboxRedirect from './components/DropboxRedirect';
import GDriveRedirect from './components/GDriveRedirect';
import BoxRedirect from './components/BoxRedirect';
import OneDriveRedirect from './components/OneDriveRedirect';
import Poster from './components/Poster';

const App = () => (
    <BrowserRouter>
        <div className="outer_div">
            <Switch>
                <Route path="/" component={Home} exact={true}/>
                <Route path="/user" component={UserView} />
                <Route path="/about" component={About} />
                <Route path="/contact" component={Contact} />
                <Route path="/faq" component={FAQ} />
                <Route path="/ivle" component={IVLERedirect} />
                <Route path="/dropbox" component={DropboxRedirect} />
                <Route path="/gdrive" component={GDriveRedirect}/>
                <Route path="/box" component={BoxRedirect}/>
                <Route path="/onedrive" component={OneDriveRedirect}/>
                <Route path="/poster" component={Poster}/>
                <Route component={NotFoundPage} />
            </Switch>
        </div>
    </BrowserRouter>
);

export default App;