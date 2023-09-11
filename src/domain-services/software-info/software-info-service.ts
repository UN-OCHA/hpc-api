import { Service } from 'typedi';
import SoftwareInfo from './graphql/types';
import { version } from '../../../package.json';

@Service()
export class SoftwareInfoService {
  getSoftwareInfo(): SoftwareInfo[] {
    return [
      {
        title: 'HPC GraphQL API',
        status: 'Stable',
        version,
      },
    ];
  }
}
