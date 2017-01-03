/**
 * Created by Caleydo Team on 31.08.2016.
 */

import 'file-loader?name=index.html!extract-loader!html-loader!./index.html';
import 'file-loader?name=404.html!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import 'file-loader?name=favicon.ico!./favicon.ico';
import 'file-loader?name=favicon.png!./favicon.png';

import 'phovea_ui/src/_bootstrap';
import 'phovea_ui/src/_font-awesome';
import './style.scss';
import 'lineupjs/src/style.scss';

import './app.ts';
