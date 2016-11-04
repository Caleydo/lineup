/**
 * Created by sam on 04.11.2016.
 */

import LineUp from 'lineupjs/src/lineup';
import {json} from 'd3';

export function load(gistid: string) {
  return new Promise((resolve, reject) => {
    json('https://api.github.com/gists/' + gistid, (error, gistdesc) => {
      if (error) {
        console.error('cant load gist id: ' + gistid, error);
        reject('cant load');
      } else if (gistdesc) {
        const firstFile = gistdesc.files[Object.keys(gistdesc.files)[0]];
        const content = JSON.parse(firstFile.content);
        resolve({name: gistdesc.description, desc: content, data: content.data});
      }
      reject('not found');
    });
  });
}

function dumpLayout(lineup: LineUp) {
  //full spec
  var s = lineup.dump();
  s.columns = (<any>lineup.data).columns;
  s.data = (<any>lineup.data).data;

  //stringify with pretty print
  return JSON.stringify(s, null, '\t');
}

export function save(lineup: LineUp, name: string) {
  //stringify with pretty print
  const str = dumpLayout(lineup);
  const args = {
    'description': name,
    'public': true,
    'files': {
      'lineup.json': {
        'content': str
      }
    }
  };
  json('https://api.github.com/gists').post(JSON.stringify(args), (error, data) => {
    if (error) {
      console.log('cant store to gist', error);
    } else {
      var id = data.id;
      document.title = 'LineUp - ' + (args.description || 'Custom');
      history.pushState({id: 'gist:' + id}, 'LineUp - ' + (args.description || 'Custom'), '#gist:' + id);
    }
  });
}
