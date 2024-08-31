import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
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
  ) {}

  async index() {
    const events = await this.client.getEvents({
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

    const chain = getAptosChain(this.client.config.network);

    const persistJobs = events.map((event) => {
      return this.prisma.bet.upsert({
        where: {
          chain_txVersion_eventIndex: {
            chain,
            txVersion: event.transaction_version,
            eventIndex: event.event_index,
          },
        },
        create: {
          chain,
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
}
