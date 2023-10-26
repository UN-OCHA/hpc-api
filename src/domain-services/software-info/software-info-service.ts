import { Service } from 'typedi';
import { version } from '../../../package.json';
import SoftwareInfo from './graphql/types';

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
