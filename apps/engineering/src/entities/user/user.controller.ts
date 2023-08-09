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
import { FlakeyApiInterceptor } from '../../flakey-api.interceptor';
import {
  AllUserResponseContract,
  CreateUserContract,
  UserResponseDto,
} from './user.contracts';
import { UserModel } from './user.model';
import { UserService } from './user.service';
import { uuid } from 'uuidv4';
import NodeCache from 'node-cache';

@ApiTags('users')
@Controller('users')
export class UserController {
  myCache: NodeCache;
  constructor(private readonly userService: UserService) {
    this.myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
  }

  @ApiOkResponse({ type: AllUserResponseContract })
  @Get()
  @UseInterceptors(new FlakeyApiInterceptor(0.9))
  async findAll(): Promise<AllUserResponseContract> {
    let users = this.myCache.get(`allUsers`);
    if (!users) {
      users = await this.userService.findAll();
      this.myCache.set('allUsers', users, 10000);
    }

    return {
      data: (users as any).map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
    };
  }

  @ApiCreatedResponse({ type: AllUserResponseContract })
  @ApiBadRequestResponse()
  @UseInterceptors(new FlakeyApiInterceptor(0.3))
  @Post()
  async create(@Body() payload): Promise<UserResponseDto> {
    const user = await this.userService.newUser({
      id: uuid(),
      name: payload.name,
      email: payload.email,
    } as UserModel);

    const newUser = await this.userService.newUser(user).catch((err) => {
      throw new Error(err);
    });

    return newUser;
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    let user: UserResponseDto = this.myCache.get(`user-${id}`);
    if (!user) {
      user = await this.userService.getById(id);
      this.myCache.set(`user-${id}`, user, 10000);
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Delete(':id')
  @ApiNotFoundResponse()
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
    return;
  }
}
