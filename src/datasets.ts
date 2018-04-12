/**
 * Created by sam on 04.11.2016.
 */

import * as dataSP500 from 'file-loader!./data/sp500_2015-06-26.csv';
import * as descSP500 from './data/sp500.json';
import * as dataWUR from 'file-loader!./data/wur2013.txt';
import * as descWUR from './data/data.json';
import * as descWURSmall from './data/data_small.json';
import * as aids from './data/aids';
import * as soccer from './data/soccer';
import {IStratification} from './taggle/splicer';

export interface IDataSetSpec {
  id: string;
  name: string;
  desc: any;
  url?: string|(()=>Promise<any[]>);
  stratifications?: IStratification[];
}
const data: IDataSetSpec[] = [
  {
    id: 'aids',
    name: 'AIDS',
    desc: aids.desc,
    url: aids.loader,
    stratifications: aids.stratifications
  },
  {
    id: 'uni',
    name: 'University Rankings',
    desc: descWURSmall,
    url: dataWUR
  },
  {
    id: 'uni_big',
    name: 'University Ranking bigger',
    desc: descWUR,
    url: dataWUR
  },
  {
    id: 'sp500',
    name: 'SP500 2015-06-26',
    desc: descSP500,
    url: dataSP500
  },
  {
    id: 'soccer',
    name: 'Soccer',
    desc: soccer.desc,
    url: soccer.loader,
    stratifications: soccer.stratifications
   }
];

export default data;
