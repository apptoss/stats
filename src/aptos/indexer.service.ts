import {
  Aptos,
  AptosConfig,
  CommittedTransactionResponse,
  Network,
} from '@aptos-labs/ts-sdk';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const apptoss = process.env.PACKAGE_ADDRESS;
const network = process.env.NETWORK as Network | Network.DEVNET;

function getAptosChain(network: Network) {
  return `APTOS_${network.toUpperCase()}`;
}

export function formatApt(octa: number): string {
  return (octa / 1e8).toFixed(4);
}

@Injectable()
export class IndexerService {
  constructor(
    private prisma: PrismaService,
    private client = new Aptos(new AptosConfig({ network })),
    private readonly chain = getAptosChain(network),
  ) {}

  async index() {
    const tip = await this.getLastHead();
    const head = await this.getSyncedHead();
    let fromVersion = undefined;
    if (head) {
      if (tip && Number(tip.version) <= head.txVersion) {
        return;
      }
      fromVersion = head.txVersion + 1;
    }

    await this.indexRange(fromVersion);

    if (tip) {
      await this.updateSyncedHead(Number(tip.version));
    }
  }

  async indexRange(fromVersion: number | undefined) {
    const events = await this.client.getEvents({
      minimumLedgerVersion: fromVersion,
      options: {
        where: {
          indexed_type: {
            _in: [
              `${apptoss}::dice::Dice`,
              `${apptoss}::limbo::Limbo`,
              `${apptoss}::coinflip::CoinFlip`,
            ],
          },
        },
      },
    });

    const persistJobs = events.map((event) => {
      return this.prisma.bet.upsert({
        where: {
          chain_txVersion_eventIndex: {
            chain: this.chain,
            txVersion: event.transaction_version,
            eventIndex: event.event_index,
          },
        },
        create: {
          chain: this.chain,
          txVersion: event.transaction_version,
          eventIndex: event.event_index,
          player: event.data.player,
          pool: event.data.pool,
          game: event.indexed_type,
          asset: 'APT',
          amount: formatApt(event.data.collateral),
          usdValue: formatApt(event.data.collateral * 6.6981), // TODO APT/USD price
          payRatio: event.data.pay_ratio_bps / 10_000,
        },
        update: {},
      });
    });
    await Promise.all(persistJobs);
  }

  async updateSyncedHead(tipVersion: number) {
    return this.prisma.head.upsert({
      where: {
        chain: this.chain,
      },
      create: {
        chain: this.chain,
        txVersion: tipVersion,
      },
      update: {
        txVersion: tipVersion,
      },
    });
  }

  async getSyncedHead() {
    return this.prisma.head.findUnique({
      where: {
        chain: this.chain,
      },
    });
  }

  async getLastHead() {
    return this.client
      .getTransactions({ options: { limit: 1 } })
      .then((txs) => {
        if (txs.length === 0) {
          return null;
        }
        return txs[0] as CommittedTransactionResponse;
      });
  }
}
