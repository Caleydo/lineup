/**
 * Created by sam on 04.11.2016.
 */

import {json} from 'd3';
import Taggle from 'taggle/src/v2/Taggle';

export function load(gistid: string) {
  return new Promise((resolve, reject) => {
    json('https://api.github.com/gists/' + gistid, (error, gistdesc) => {
      if (error) {
        console.error('cannot load gist id: ' + gistid, error);
        reject('cant load');
      } else if (gistdesc) {
        const firstFile = gistdesc.files[Object.keys(gistdesc.files)[0]];
        json(firstFile.raw_url, (error, content) => {
          if (error) {
            console.error('cannot load gist content at: ' + firstFile.raw_url, error);
            reject('not found');
          } else if (content) {
            resolve({name: gistdesc.description, desc: content, data: content.data});
          }
        });
      } else {
		reject('not found');
	  }
    });
  });
}

function dumpLayout(taggle: Taggle) {
  //full spec
  const s = taggle.dump();
  s.columns = (<any>taggle.data).columns;
  s.data = (<any>taggle.data).data;

  //stringify with pretty print
  return JSON.stringify(s, null, '\t');
}

export function save(taggle: Taggle, name: string) {
  //stringify with pretty print
  const str = dumpLayout(taggle);
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
      const id = data.id;
      document.title = 'Taggle - ' + (args.description || 'Custom');
      history.pushState({id: 'gist:' + id}, 'Taggle - ' + (args.description || 'Custom'), '#gist:' + id);
    }
  });
}
