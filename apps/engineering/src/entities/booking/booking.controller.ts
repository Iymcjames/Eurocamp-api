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
  AllBookingResponseContract,
  BookingRequestContract,
  BookingResponseDto,
} from './booking.contracts';
import { BookingModel } from './booking.model';
import NodeCache from 'node-cache';
import { BookingService } from './booking.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  myCache: NodeCache;
  constructor(private readonly bookingService: BookingService) {
    this.myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
  }

  @ApiOkResponse({ type: AllBookingResponseContract })
  @Get()
  @UseInterceptors(new FlakeyApiInterceptor(0.9))
  async findAll(): Promise<AllBookingResponseContract> {
    let bookings = this.myCache.get('allBookings');
    if (!bookings) {
      bookings = await this.bookingService.findAllBookings();
      this.myCache.set('allBookings', bookings, 10000);
    }

    return {
      data: (bookings as any).map((booking) => ({
        id: booking.id,
        user: booking.user,
        parc: booking.parc,
        bookingdate: booking.bookingdate,
        comments: booking.comments,
      })),
    };
  }

  @ApiCreatedResponse({ type: AllBookingResponseContract })
  @ApiBadRequestResponse()
  @Post()
  async create(@Body() payload): Promise<BookingResponseDto> {
    // create new booking
    const booking = await this.bookingService.newBooking({
      ...payload,
      id: uuid(),
    } as BookingModel);

    return booking;
  }

  @Get(':id')
  @ApiOkResponse({ type: BookingResponseDto })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  async getBooking(@Param('id') id: string): Promise<BookingResponseDto> {
    let booking: BookingResponseDto = this.myCache.get(`booking-${id}`);
    if (!booking) {
      booking = await this.bookingService.getBookingById(id);
      this.myCache.set(`booking-${id}`, booking, 10000);
    }

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  @Delete(':id')
  @ApiNotFoundResponse()
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.bookingService.removeBooking(id);
    return;
  }
}
