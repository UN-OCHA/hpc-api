import { Request } from "express"
import * as crypto from 'crypto';
import { URL } from 'url';
import * as fetch from 'node-fetch';
import { ForbiddenError } from "apollo-server-express";

import AuthToken from '../models/AuthToken';
import Participant, { ParticipantId } from '../models/Participant';
import {calculatePermissions} from './permissions';
import AuthRequirements, { RequiredPermission, RequiredPermissionsCondition, RequiredPermissionsConditionOr, RequiredPermissionsConjunctionAnd } from '../types/AuthRequirements';
import Context from "../types/Context";
import { GrantedPermissions } from "../types/Permissions";
import { HID_CACHE, HIDInfo } from './cache';
import * as config from '../config';

const getHidInfo = async (token: string) => {
  const existing = HID_CACHE.get(token);
    if (existing) {
      if (existing.type === 'success') {
        return existing.info;
      } else {
        throw new ForbiddenError(existing.message);
      }
    } else {
      const accountUrl = new URL('/account.json', config.authBaseUrl);
      // Reference fetch.default to allow for mocking
      const res = await fetch.default(accountUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          const r = await res.json();
          const message = r.message || 'Invalid Token';
          HID_CACHE.store(token, { type: 'forbidden', message });
          throw new ForbiddenError(message);
        } else {
          throw new Error(`Unexpected error from HID: ${res.statusText}`);
        }
      }
      const data = await res.json();
      // if (!HID_ACCOUNT_INFO.is(data)) {
      //   throw new Error('Got invalid data from HID');
      // }
      const info: HIDInfo = {
        userId: data.user_id,
        family_name: data.family_name,
        given_name: data.given_name,
        email: data.email,
      }
      HID_CACHE.store(token, { type: 'success', info });
      return info;
    }
}

export const extractToken = (req: Request) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1] as string;
    } else if (req.query && req.query.token) {
        return req.query.token as string;
    }
    return null;
}

export const getParticipantFromToken = async (
    token: string
): Promise<Participant | undefined> => {
    const tokenHash =
      crypto.createHash('sha256').update(token).digest().toString('hex');
  
    const proxy = await AuthToken.findOne({
        where: {
            tokenHash
        },
        relations: [ 'participantObj' ]
    });
  
    if (proxy && proxy.expires.getTime() > Date.now()) {
        return proxy.participantObj;
    }
    const hidPromise = getHidInfo(token)
      .then(hidInfo => ({ result: 'success' as 'success', hidInfo }))
      .catch(error => ({ result: 'error' as 'error', error }));

    const hidInfoResult = await hidPromise;
    if (hidInfoResult.result === 'error') {
      throw hidInfoResult.error;
    }
    const { hidInfo } = hidInfoResult;
    if (!hidInfo?.userId) {
      return undefined;
    }
    let participant = await Participant.findOne({
      where: {
        hidId: hidInfo.userId,
      },
    }) || undefined;
    if (!participant) {
      // Create a new participant for this HID account
      // and transfer over all invites
      participant = await Participant.create({
        email: hidInfo.email,
        hidId: hidInfo.userId,
        name_family: hidInfo.family_name,
        name_given: hidInfo.given_name,
      });
  
      await participant.activateInvitesForEmail(hidInfo.email);
    } else if (participant.email !== hidInfo.email) {
      // Update the user's email and activate any invites
      participant.email = hidInfo.email;
      await participant.save();
      await participant.activateInvitesForEmail(hidInfo.email);
    }
    return participant;
}

/**
 * Create a new access token for the given user.
 */
export const createToken = async ({
    participant,
    expires,
  }: {
    participant: ParticipantId;
    expires: Date;
  }) => {
    const token = (await crypto.randomBytes(48)).toString('hex');
    const tokenHash =
      crypto.createHash('sha256').update(token).digest().toString('hex');
    const authToken = AuthToken.create();
    authToken.participant = participant;
    authToken.tokenHash = tokenHash;
    authToken.expires = expires;
    await authToken.save();
    return {
      instance: authToken,
      token
    };
  }

const isAnd = (conj: RequiredPermissionsCondition):
  conj is RequiredPermissionsConjunctionAnd =>
  !!(conj as RequiredPermissionsConjunctionAnd).and;

const isOr = (conj: RequiredPermissionsCondition):
  conj is RequiredPermissionsConditionOr =>
  !!(conj as RequiredPermissionsConditionOr).or;

export const getFlattenedAuthRequirements = async (roles: AuthRequirements[], context: Context, args: Record<string, any>) => {
  const calculatedAuthRequirements = await Promise.all(roles.map(role => typeof role === 'function' ? role({
    log: context.logger,
    req: context.req,
    args
  }) : Promise.resolve([role])))
  return calculatedAuthRequirements.reduce((acc, requirements) => acc.concat(requirements), []);
}

  export const hasRequiredPermissions = (
    granted: GrantedPermissions,
    condition: RequiredPermissionsCondition
  ): boolean => {

    if (condition === 'anyone') {
      return true;
    }
  
    const isAllowed = (permission: RequiredPermission): boolean => {
      if (permission.type === 'global') {
        return !!granted.global?.has(permission.permission);
      } else {
        const map = granted[permission.type];
        const set: Set<string> | undefined = map?.get(permission.id);
        return !!set?.has(permission.permission);
      }
    };
  
    const checkCondition = (cond: RequiredPermissionsCondition): boolean => {
      if (cond === 'anyone') {
        return true
      } else if(cond === 'noone') {
        return false;
      } else if (isOr(cond)) {
        for (const conjunction of cond.or) {
          if (checkCondition(conjunction)) {
            return true;
          }
        }
        return false;
      } else if (isAnd(cond)){
        for (const p of cond.and) {
          if (!checkCondition(p)) {
            return false;
          }
        }
        return true;
      } else {
        return isAllowed(cond)
      }
    }
  
    return checkCondition(condition);
  }

/**
 * Check whether the specified action is allowed to be performed by the actor
 * behind the current request.
 */
export const actionIsPermitted = async (
  context: Context,
  requiredPermissions: RequiredPermissionsCondition[],
) => {
  const grantedPermissions = await calculatePermissions(context);
  console.log("grantedPermissions: ", JSON.stringify(grantedPermissions));
  return true;
  // return requiredPermissions.every(requiredPermission => hasRequiredPermissions(grantedPermissions, requiredPermission));
}
  