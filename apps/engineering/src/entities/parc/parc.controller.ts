import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { uuid } from 'uuidv4';
import { FlakeyApiInterceptor } from '../../flakey-api.interceptor';
import {
  AllParcResponseContract,
  ParcRequestContract,
  ParcResponseDto,
} from './parc.contracts';
import { ParcModel } from './parc.model';
import { ParcService } from './parc.service';
import NodeCache from 'node-cache';

@ApiTags('parcs')
@Controller('parcs')
export class ParcController {
  myCache: NodeCache;
  constructor(private readonly parcService: ParcService) {
    this.myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
  }

  @ApiOkResponse({ type: AllParcResponseContract })
  @Get()
  async findAll(): Promise<AllParcResponseContract> {
    let parcs = this.myCache.get(`allParcs`);
    if (!parcs) {
      parcs = await this.parcService.findAll();
      this.myCache.set('allParcs', parcs, 10000);
    }

    return {
      data: (parcs as any).map((parc) => ({
        id: parc.id,
        name: parc.name,
        description: parc.description,
      })),
    };
  }

  @ApiCreatedResponse({ type: AllParcResponseContract })
  @ApiBadRequestResponse()
  @Post()
  async create(
    @Body() payload: { name: string; description: string }
  ): Promise<ParcResponseDto> {
    const parc = await this.parcService.newUser({
      id: uuid(),
      name: payload.name,
      description: payload.description,
    } as ParcModel);

    return parc;
  }

  @Get(':id')
  @ApiOkResponse({ type: ParcResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  @UseInterceptors(new FlakeyApiInterceptor(0.7))
  async getParc(@Param('id') id: string): Promise<ParcResponseDto> {
    let parc: ParcResponseDto = this.myCache.get(`parc-${id}`);
    if (!parc) {
      parc = await this.parcService.getById(id);
      this.myCache.set(`parc-${id}`, parc, 10000);
    }

    if (!parc) {
      throw new NotFoundException('Parc not found');
    }

    return parc;
  }

  @Delete(':id')
  @ApiNotFoundResponse()
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.parcService.remove(id);

    return;
  }
}
