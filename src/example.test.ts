import {
  MikroORM,
  Entity,
  PrimaryKey,
  Property,
  EntitySchema,
  Type,
  Platform,
} from "@mikro-orm/sqlite";

export class UserId {
  public static create(value: number): UserId {
    return new UserId(value);
  }

  private readonly _value: number;
  private constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Invalid UserId value");
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: UserId): boolean {
    return other && this._value === other._value;
  }
}

class User {
  private _id!: UserId;

  private _name: string;

  private _email: string;

  constructor(name: string, email: string) {
    this._name = name;
    this._email = email;
  }

  get id(): UserId {
    return this._id;
  }

  private set id(value: UserId) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
    };
  }
}

class UserIdType extends Type<UserId | undefined, number | undefined> {
  convertToDatabaseValue(
    value: UserId | undefined,
    platform: Platform
  ): number | undefined {
    return value instanceof UserId ? value.value : value;
  }

  convertToJSValue(
    value: number | undefined,
    platform: Platform
  ): UserId | undefined {
    return typeof value === "number" ? UserId.create(value) : value;
  }

  getColumnType(): string {
    return "int";
  }

  compareAsType(): string {
    return "number";
  }
}

const userSchema = new EntitySchema<User>({
  class: User,
  properties: {
    id: { primary: true, type: UserIdType, autoincrement: true },
    name: { type: "string" },
    email: { type: "string", unique: true },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [userSchema],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("basic CRUD example", async () => {
  orm.em.create(User, { name: "Foo", email: "foo" });
  orm.em.create(User, { name: "Foo1", email: "foo1" });
  orm.em.create(User, { name: "Foo2", email: "foo2" });
  await orm.em.flush();
  orm.em.clear();

  const users = await orm.em.findAll(User);
  expect(users.length).toBe(3);
});
