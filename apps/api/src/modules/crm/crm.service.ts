import { dbSet, dbGet, dbGetAll, paths } from '../database/database';
import { listProposals } from '../proposal-generator/proposal.service';
import type { Client, Proposal } from '@domain';

export const createClient = async (client: Client): Promise<Client> => {
  await dbSet(paths.client(client.clientId), client);
  return client;
};

export const getClientById = async (clientId: string): Promise<Client | null> => {
  return dbGet<Client>(paths.client(clientId));
};

export const getClients = async (): Promise<Client[]> => {
  return dbGetAll<Client>(paths.clients());
};

export const getProposals = async (): Promise<Proposal[]> => {
  return listProposals();
};
