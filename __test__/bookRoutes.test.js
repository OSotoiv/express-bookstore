process.env.NODE_ENV = 'test';
const app = require("../app");
const db = require("../db");
const request = require("supertest");
const jsonschema = require("jsonschema");
const bookSchema = require("../schemas/bookSchema");
const ExpressError = require('../expressError')

describe("class Book Model Testing", () => {
    beforeAll(async () => {
        await db.query(`INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) VALUES
        ('1234567890', 'https://www.amazon.com/Book1', 'John Doe', 'English', 250, 'Publisher1', 'Book One', 2022),
        ('2345678901', 'https://www.amazon.com/Book2', 'Jane Smith', 'French', 300, 'Publisher2', 'Book Two', 2021),
        ('3456789012', 'https://www.amazon.com/Book3', 'Bob Johnson', 'Spanish', 150, 'Publisher3', 'Book Three', 2020),
        ('4567890123', 'https://www.amazon.com/Book4', 'Sarah Lee', 'German', 200, 'Publisher4', 'Book Four', 2019),
        ('5678901234', 'https://www.amazon.com/Book5', 'David Kim', 'Chinese', 350, 'Publisher5', 'Book Five', 2018);`)
    });
    test("GET /books/", async () => {
        const response = await request(app)
            .get(`/books/`)
        expect(response.statusCode).toBe(200);
        expect(response.body.books).toContainEqual(
            expect.objectContaining({
                author: expect.any(String),
                language: expect.any(String),
                title: expect.any(String)
            })
        )
    });
    test("GET /books/:id", async () => {
        const response = await request(app)
            .get(`/books/1234567890`)
        expect(response.statusCode).toBe(200);
        expect(response.body.book).toEqual(
            expect.objectContaining({
                author: expect.any(String),
                language: expect.any(String),
                title: expect.any(String)
            })
        )
    });
    test("GET /books/:id With invalid id", async () => {
        const badID = "1234569999";
        const response = await request(app)
            .get(`/books/${badID}`)
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe(`There is no book with an isbn ${badID}`)
    });
    test("POST /books/", async () => {
        const response = await request(app)
            .post(`/books/`)
            .send({
                "isbn": "posttest123",
                "amazon_url": "https://www.amazon.com/post_test",
                "author": "octavian",
                "language": "English",
                "pages": 50,
                "publisher": "Post Test House",
                "title": "Post Test",
                "year": 2022
            })
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toEqual(
            expect.objectContaining({
                author: expect.any(String),
                language: expect.any(String),
                title: expect.any(String)
            })
        )
    });
    test("POST /books/ With invalid body", async () => {
        const response = await request(app)
            .post(`/books/`)
            .send({
                "isbn": "posttest999",
                "amazon_url": "https://www.amazon.com/invalid_link",
                "author": "",
                "language": "English",
                "pages": 50,
                "publisher": "Invalid Publishing",
                "title": "",
                "year": 2022
            })
        expect(response.statusCode).toBe(400)
        expect(response.body.message).toContainEqual('instance.author does not meet minimum length of 3')
        expect(response.body.message).toContainEqual('instance.title does not meet minimum length of 3')
    });
    test("PUT /books/:isbn", async () => {
        const response = await request(app)
            .put(`/books/posttest123`)
            .send({
                "amazon_url": "https://www.amazon.com/post_test",
                "author": "octavian",
                "language": "English",
                "pages": 50,
                "publisher": "Post Test House",
                "title": "Post Test Updated",
                "year": 2020
            })
        expect(response.statusCode).toBe(200);
        expect(response.body.book).toEqual(
            expect.objectContaining({
                title: "Post Test Updated",
                year: 2020
            })
        )

    });
    test("PUT /books/:isbn With invalid isbn", async () => {
        const badISBN = '5678900000'
        const response = await request(app)
            .put(`/books/${badISBN}`)
            .send({
                "amazon_url": "https://www.amazon.com/invalid_link",
                "author": "",
                "language": "English",
                "pages": 50,
                "publisher": "Invalid Publishing",
                "title": "",
                "year": 2022
            })
        expect(response.body.message).toBe(`There is no book with an isbn ${badISBN}`)
    });
    test("PUT /books/:isbn With missing properties. Should default to original properties", async () => {
        const goodISBN = '5678901234';
        const response = await request(app)
            .put(`/books/${goodISBN}`)
            .send({
                "amazon_url": "https://www.amazon.com/Book5",
                // "author": "David Kim",
                "language": "Chinese",
                "pages": 350,
                "publisher": "UPDated Publishing5",
                // "title": "Book Five",
                "year": 2022
            })
        //missing properites will default to original properties
        expect(response.statusCode).toBe(200);
        expect(response.body.book).toEqual(
            expect.objectContaining({
                title: "Book Five",
                author: "David Kim",
                publisher: "UPDated Publishing5"
            })
        )
    });
    test("DELETE /books/:isbn", async () => {
        const isbn = 'posttest123'
        const response = await request(app)
            .delete(`/books/${isbn}`);
        expect(response.statusCode).toBe(200)
        expect(response.body.message).toBe('Book deleted')
        const book = await db.query(`SELECT * FROM books WHERE isbn = $1`, [isbn])
        expect(book.rows).toHaveLength(0);
    });
    test("DELETE /books/:isbn With invalid ISBN", async () => {
        const badISBN = '5678900000'
        const response = await request(app)
            .delete(`/books/${badISBN}`)
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe(`There is no book with an isbn '${badISBN}`);

        const book = await db.query(`SELECT * FROM books WHERE isbn = $1`, [badISBN])
        expect(book.rows).toHaveLength(0);
    });

})
afterAll(async function () {
    await db.query(`DELETE FROM books;`)
    await db.end();
});