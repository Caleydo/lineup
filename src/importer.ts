/**
 * Created by sam on 04.11.2016.
 */

import {selectFileLogic} from 'phovea_importer/src/index';
import {generateDialog} from 'phovea_ui/src/dialogs';
import {parseCSV} from 'phovea_importer/src/parser';
import * as d3 from 'd3';
import {createValueTypeEditors} from 'phovea_importer/src/valuetypes';
import {importTable} from 'phovea_importer/src/importtable';
import {initTaggle} from './app';
import {taggle} from './app';
import {EGuessedState} from 'lineupjs/src/model/Column';


interface IImportedData {
  name: string;

  desc: {
    columns: IColumnDesc[],
    layout?: {
      primary: any[]
    }
  };

  data: any;
}

interface IColumnDesc {
  type: string;
  column: string;
  label: string;
  color?: string;
  cssClass?: string;
  categories?: string[];
  domain?: number[];
  guessed?: EGuessedState;
}

function deriveColumns(columns: any[], guessed: EGuessedState = EGuessedState.CHECKED):IColumnDesc[] {
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
      case 'matrix':
        r.type = 'numbers';
        r.domain = val.range;
        r.colorRange = val.colorRange;
        r.dataLength = val.dataLength;
        r.labels = val.labels;
        break;
      default:
        r.type = 'string';
        break;
    }
    r.guessed = guessed;

    return r;
  });
}


function convertLoaded(r, guessed: EGuessedState = EGuessedState.CHECKED):IImportedData {
  if (r == null || r.desc.type !== 'table') {
    return;
  }
  const columns = deriveColumns((<any>r.desc).columns, guessed);
  if ((<any>r.desc).idcolumn !== '_index') {
    columns.unshift({type: 'string', label: 'Row', column: (<any>r.desc).idcolumn});
  }
  const name = r.desc.name;
  const desc = {columns};
  //(r.desc, r.data, (<any>r.desc).idcolumn);
  return {name, desc, data: r.data};
}

function addDefaultColumns(data: IImportedData): IImportedData {
  const defaultColumns = [
    {
      type: 'aggregate',
    },
    {
      type: 'group',
      width: 150
    },
    {
      type: 'rank'
    },
    {
      type: 'selection'
    }
  ];

  if(!data.desc.layout) {
    data.desc.layout = {
      primary: [...defaultColumns, ...data.desc.columns]
    };
  }

  return data;
}

function loadJSON(file: File, name: string):Promise<IImportedData> {
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

  let data:Promise<IImportedData>;

  const selectedFile = (file: File) => {
    let name = file.name;
    const extension = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
    name = name.substring(0, name.lastIndexOf('.')); //remove .csv

    if (extension === 'json') {
      data = loadJSON(file, name)
        .then((r) => {
          $parent.html('Loaded!');
          return r;
        });

    } else { // assume some kind of csv
      data = Promise.all([<any>parseCSV(file), createValueTypeEditors()])
        .then((results) => {
          const editors = results[1];
          const data = results[0].data;
          const header = data.shift();

          return importTable(editors, $parent, header, data, name);
        })
        .then((csvTable) => {
          return convertLoaded(csvTable());
        })
        .then((data) => {
          return addDefaultColumns(data);
        });
    }
  };

  $parent.html(`
    <div class="drop-zone">
      <input type="file" id="importer-file" />
    </div>
  `);

  selectFileLogic($parent.select('div.drop-zone'), $parent.select('input[type=file]'), selectedFile);

  return {
    getResult: () => data
  };
}

export default function importFile():Promise<IImportedData> {
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

export function initImporter() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.hidden = true;
  fileInput.className = 'hidden';
  document.body.appendChild(fileInput);

  selectFileLogic(d3.select('#app'), d3.select(fileInput), (file: File) => {

    let name = file.name;
    const fileExtension = name.substring(name.lastIndexOf('.') + 1).toLowerCase();

    if (fileExtension === 'csv') {
      name = name.substring(0, name.lastIndexOf('.')); //remove .csv

      Promise.all([<any>parseCSV(file), createValueTypeEditors()])
        .then((results) => {
          const editors = results[1];
          const data = results[0].data;
          const header = data.shift();

          return importTable(editors, d3.select(document.createElement('div')), header, data, name);
        })
        .then((csvTable) => {
          return convertLoaded(csvTable(), EGuessedState.GUESSED);
        })
        .then((data) => {
          return addDefaultColumns(data);
        })
        .then(({name, desc, data}) => {
          initTaggle(name, desc, data, [], taggle);
        });

    } else {

      let title = 'Invalid file type';
      let text = 'The provided file type is not supported! Please try a CSV file instead.';

      if(fileExtension === 'json') {
        title = `No support for drag-and-drop import`;
        text = `Please use the JSON import dialog (from the header) to import JSON files.`;
      }

      //file extension not supported
      const dialog = generateDialog(title, 'Close');
      dialog.body.innerText = text;
      dialog.onSubmit(() => {
        dialog.hide();
      });
      dialog.onHide(() => {
        dialog.destroy();
      });
      dialog.show();
    }
  });
}

