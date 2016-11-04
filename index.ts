/**
 * Created by Caleydo Team on 31.08.2016.
 */

import 'file?name=index.html!./index.html';
import 'file?name=404.html!./404.html';
import 'file?name=robots.txt!./robots.txt';
import 'phovea_bootstrap_fontawesome/src/_bootstrap';
import './style.scss';
import {create as createApp} from './app';
import {create as createHeader, AppHeaderLink} from 'phovea_bootstrap_fontawesome/src/header';
import {APP_NAME} from './language';

createHeader(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  { appLink: new AppHeaderLink(APP_NAME) }
);

const parent = document.querySelector('#app');
createApp(parent).init();
