/**
 * Created by sam on 04.11.2016.
 */

import {selectFileLogic} from 'phovea_importer/src/index';
import {generateDialog} from 'phovea_ui/src/dialogs';
import {parseCSV} from 'phovea_importer/src//parser';
import * as d3 from 'd3';
import {createValueTypeEditors} from 'phovea_importer/src//valuetypes';
import {importTable} from 'phovea_importer/src//importtable';


function deriveColumns(columns: any[]) {
  return columns.map((col) => {
    const r: any = {
      column: col.column,
      label: col.name
    };
    if (col.color) {
      r.color = col.color;
    } else if (col.cssClass) {
      r.cssClass = col.cssClass;
    }

    //use magic word to find extra attributes
    if (col.lineup) {
      Object.keys(col.lineup).forEach((k) => {
        r[k] = col.lineup[k];
      });
    }
    const val = col.value;
    switch (val.type) {
      case 'string':
        r.type = 'string';
        break;
      case 'categorical':
        r.type = 'categorical';
        r.categories = col.categories;
        break;
      case 'real':
      case 'int':
        r.type = 'number';
        r.domain = val.range;
        break;
      default:
        r.type = 'string';
        break;
    }
    return r;
  });
}


function convertLoaded(r) {
  if (r == null || r.desc.type !== 'table') {
    return;
  }
  const columns = deriveColumns((<any>r.desc).columns);
  if ((<any>r.desc).idcolumn !== '_index') {
    columns.unshift({type: 'string', label: 'Row', column: (<any>r.desc).idcolumn});
  }
  const name = r.desc.name;
  const desc = {columns};
  //(r.desc, r.data, (<any>r.desc).idcolumn);
  return {name, desc, data: r.data};
}

function loadJSON(file: File, name: string) {
  return new Promise((resolve) => {
    const f = new FileReader();
    f.addEventListener('load', (event) => {
      const desc = JSON.parse((<any>(event.target)).result);
      resolve({name, desc, data: desc.data});
    });
    f.readAsText(file, 'utf-8');
  });
}

function createImporter(parent: Element) {
  const $parent = d3.select(parent).append('div').classed('caleydo-importer', true);

  let buildCSV = null;
  let jsonDesc = null;
  const selectedFile = (file: File) => {
    let name = file.name;
    const extension = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
    name = name.substring(0, name.lastIndexOf('.')); //remove .csv

    if (extension === 'json') {
      loadJSON(file, name).then((r) => {
        jsonDesc = r;
        $parent.html('Loaded!');
      });
    } else { // assume some kind of csv
      Promise.all([<any>parseCSV(file), createValueTypeEditors()]).then((results) => {
        const editors = results[1];
        const data = results[0].data;
        const header = data.shift();

        return importTable(editors, $parent, header, data, name);
      }).then((r) => buildCSV = r);
    }
  };

  $parent.html(`
      <div class="drop-zone">
        <input type="file" id="importer-file" />
      </div>
    `);

  selectFileLogic($parent.select('div.drop-zone'), $parent.select('input[type=file]'), selectedFile);

  return {
    getResult: () => buildCSV ? convertLoaded(buildCSV()) : jsonDesc
  };
}

export default function importFile() {
  return new Promise((resolve, reject) => {
    const dialog = generateDialog('Import CSV/JSON', 'Import CSV/JSON');
    const importer = createImporter(dialog.body);

    let submitted = false;

    dialog.onSubmit(() => {
      const r = importer.getResult();
      submitted = true;
      dialog.hide();
      resolve(r);
    });
    dialog.onHide(() => {
      if (!submitted) {
        reject('Hide');
      }
    });
    dialog.show();
  });
}
