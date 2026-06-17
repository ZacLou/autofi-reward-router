import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export interface TransactionRecord {
  txHash: string;
  timestamp: string;
  developerPublicKey: string;
  sendAmount: string;
  sendAsset: string;
  destAsset: string;
  status: 'success' | 'failed' | 'pending';
}

const HISTORY_FILE = path.join(process.cwd(), '.tx-history.json');

export class TransactionHistory {
  private records: TransactionRecord[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        this.records = JSON.parse(data);
        logger.debug(`Loaded ${this.records.length} transaction records`);
      }
    } catch (err) {
      logger.warn('Failed to load transaction history', err instanceof Error ? err.message : String(err));
    }
  }

  add(record: Omit<TransactionRecord, 'timestamp'>): void {
    const fullRecord: TransactionRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };
    this.records.push(fullRecord);
    this.save();
  }

  getByDeveloper(publicKey: string): TransactionRecord[] {
    return this.records.filter(r => r.developerPublicKey === publicKey);
  }

  getSuccessful(): TransactionRecord[] {
    return this.records.filter(r => r.status === 'success');
  }

  private save() {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.records, null, 2));
    } catch (err) {
      logger.error('Failed to save transaction history', err instanceof Error ? err.message : String(err));
    }
  }

  getAll(): TransactionRecord[] {
    return [...this.records];
  }
}

export const transactionHistory = new TransactionHistory();
