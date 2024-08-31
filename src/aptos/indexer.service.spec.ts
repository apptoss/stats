import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { IndexerService } from './indexer.service';

describe('IndexerService', () => {
  let service: IndexerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    const prisma = module.get(PrismaService);
    service = new IndexerService(prisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('all', async () => {
    await service.index();
  });
});
