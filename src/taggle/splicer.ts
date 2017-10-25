import {ISummaryFunction} from 'lineupjs/src/ui/interfaces';
import {IRankingHeaderContext} from 'lineupjs/src/ui/engine/interfaces';
import NumbersColumn from 'lineupjs/src/model/NumbersColumn';
import {createNestedDesc} from 'lineupjs/src/model';
import {ICategory} from 'lineupjs/src/model/CategoricalColumn';
import Column from 'lineupjs/src/model/Column';
import NestedColumn from 'lineupjs/src/model/NestedColumn';

/**
 * Created by Samuel Gratzl on 10.10.2017.
 */

export interface IStratification {
  name: string;
  categories: (ICategory | string)[];
  data: string[];
}

/**
 * special summary to split a matrix by a categorical attribute
 * @param {IStratification[]} categories
 * @return {ISummaryFunction}
 */
export function matrixSplicer(categories: IStratification[]): ISummaryFunction {
  return (col: NumbersColumn, node: HTMLElement, interactive: boolean, ctx: IRankingHeaderContext) => {
    node.dataset.summary='stratify';
    if (!interactive) {
      node.innerHTML = '';
      return;
    }
    node.innerHTML = `<select>
        <option value="">Stratify By...</option>
        ${categories.map((d) => `<option value="${d.name}">${d.name}</option>`).join('')}
    </select>`;
    const select = <HTMLSelectElement>node.firstElementChild!;
    select.addEventListener('change', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      const selected = categories[select.selectedIndex -1]; // empty option
      if (!selected) {
        return;
      }
      const base = <NestedColumn>ctx.provider.create(createNestedDesc(selected.name));
      const w = col.getWidth();
      selected.categories.forEach((group) => {
        const g = typeof group === 'string' ? {name: group, label: group} : group;
        const gcol = <NumbersColumn>ctx.provider.clone(col);
        // set group name
        gcol.setMetaData({label: g.label || g.name, color: g.color || Column.DEFAULT_COLOR, description: ''});

        const length = selected.data.reduce((a, s) => a + (s === g.name ? 1 : 0), 0);
        gcol.setSplicer({
          length,
          splice: (vs) => vs.filter((_v, i) => selected.data[i] === g.name)
        });
        gcol.setWidth(w * length / selected.data.length);

        base.push(gcol);
      });

      // replace with splitted value
      col.insertAfterMe(base);
      col.removeMe();
    });
  };
}
