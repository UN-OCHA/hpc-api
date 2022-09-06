import { Resolver } from 'type-graphql';
import { Service } from 'typedi';
import { FlowObjectService } from '../flow-object-service';
import FlowObject from './types';

@Service()
@Resolver(FlowObject)
export default class FlowObjectResolver {
  constructor(private flowObjectService: FlowObjectService) {}
}
