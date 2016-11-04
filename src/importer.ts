/**
 * Created by sam on 04.11.2016.
 */

import {create as createImporter} from 'phovea_importer/src/index';
import {generateDialog} from 'phovea_bootstrap_fontawesome/src/dialogs';

function deriveColumns(columns: any[]) {
  return columns.map((col) => {
    var r: any = {
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
    var val = col.value;
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

export default function importTable() {
  return new Promise((resolve, reject) => {
    const dialog = generateDialog('Import', 'Import');
    const importer = createImporter(dialog.body, {});

    var submitted = false;

    dialog.onSubmit(() => {
      const r = importer.getResult();
      if (r == null || r.desc.type !== 'table') {
        return;
      }
      const columns = deriveColumns((<any>r.desc).columns);
      if ((<any>r.desc).idcolumn !== '_index') {
        columns.unshift({type: 'string', label: 'Row', column: (<any>r.desc).idcolumn});
      }
      const name = 'Uploaded File';
      const desc = { columns };
      //(r.desc, r.data, (<any>r.desc).idcolumn);
      submitted = true;
      dialog.hide();
      resolve({name, desc, data: r.data});
    });
    dialog.onHide(() => {
      if (!submitted) {
        reject('Hide');
      }
    });
    dialog.show();
  });
}
