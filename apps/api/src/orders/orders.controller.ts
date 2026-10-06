import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserData,
} from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateOrderDto } from './create-order.dto.js';
import type { CreateOrderResponse, OrderDto } from './order.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateOrderDto,
  ): Promise<CreateOrderResponse> {
    return this.orders.create(user.id, dto.productId);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserData): Promise<OrderDto[]> {
    return this.orders.findAllForUser(user.id);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<OrderDto> {
    return this.orders.findByIdForUser(user.id, id);
  }
}
