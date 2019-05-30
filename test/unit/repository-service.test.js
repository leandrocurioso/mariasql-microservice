const Bluebird = require("bluebird");
const PrototypeExtension = require("../../src/infrastructure/prototype-extension");
const RepositoryService = require("../../src/infrastructure/service/repository-service");
const { expect } = require("chai");

describe("Unit tests for class RepositoryService will", () => {

    let repositoryService;

    before(done => {
        const prototypeExtension = new PrototypeExtension({ bluebird: Bluebird });
        prototypeExtension.register();
        return done();
    });

    beforeEach(done => {
        repositoryService = new RepositoryService({
            configuration: {
                service: {
                    repositoryForbiddenSqlVerbs: [ "DROP" ]
                }
            },
            connection: {},
            changeCase: {},
            logger: {}
        });
        return done();
    });

    context("test method isTransaction", () => {
        it("to check if it is a transaction", done => {
            const isTransaction = repositoryService.isTransaction([
                "INSERT", "UPDATE", "DELETE" 
            ]);
            expect(isTransaction).is.equal(true);
            return done();
        });

        it("to check if it is not a transaction", done => {
            const isTransaction = repositoryService.isTransaction([
                "SELECT", "UPDATE", "SELECT" 
            ]);
            expect(isTransaction).is.equal(false);
            return done();
        });
    });

    context("test method getQueryVerb", () => {
        it("to check if sql verb extraction is valid", done => {
            const sql = "select * from test;";
            const sqlVerb = repositoryService.getQueryVerb(sql);
            expect(sqlVerb).to.be.equal("SELECT");
            return done();
        });
    });

    context("test method checkForbiddenSqlVerb", () => {
        it("to check if sql verb is forbidden", done => {
            try {
                repositoryService.checkForbiddenSqlVerb(httpVerb);
            } catch(err) {
                expect(err).to.be.instanceOf(Error);
            } finally {
                return done();
            }
        });
    });


});