import { Controller } from '@nestjs/common';
import { BooksService } from './books.service.js';

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) {}
}
