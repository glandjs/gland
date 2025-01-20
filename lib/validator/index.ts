import { NestedSchema, Rule, Schema } from '../decorator';
import { ValidatorProcess } from './Validator';
@Schema({
  section: 'headers',
  defaultRules: ['required'],
})
export class HeaderSchema {
  @Rule()
  example_header = ['boolean'];
}

@Schema({
  section: 'body',
  defaultRules: ['required'],
})
export class BodySchema {
  @Rule({
    messages: {
      required: 'The username is required.',
      string: 'The username must be a string.',
      min: 'The username must be at least 3 characters long.',
    },
  })
  username = ['string', 'min:3'];

  @Rule({
    messages: {
      required: 'The email is required.',
      email: 'The email must be a valid email address.',
    },
  })
  email = ['string', 'email'];

  @Rule({
    messages: {
      required: 'The password is required.',
      string: 'The password must be a string.',
      min: 'The password must be at least 8 characters long.',
    },
  })
  password = ['min:8'];
  @Rule({
    messages: {
      required: 'The "isActive" field is required.',
      boolean: 'The "isActive" field must be a boolean.',
    },
  })
  isActive = ['boolean'];
  @Rule({
    messages: {
      string: 'The "notes" field must be a string.',
    },
  })
  notes? = ['string'];
}

export class UserSchema {
  @NestedSchema({
    conditions: [
      {
        message: '',
        schema: HeaderSchema,
      },
    ],
  })
  body = BodySchema;
  @NestedSchema()
  headers = HeaderSchema;
}
const userSchame = new UserSchema();
// const username = userSchame.body.username; /** I want username errors to be returned when the user says this. What should I do? */
// console.log('username:', username); // like this {"The username is required."}

const example3: {
  body: any;
  headers: any;
} = {
  body: {
    username: 'admin',
    password: 'Admin123',
    email: 'invalid',
    isActive: true,
    notes: 'Notes about the admin.',
  },
  headers: {
    example_header: 'hello',
  },
};

// Validation Process
(async () => {
  console.log('=== Validation Errors: Example 3 ===');
  const result = await ValidatorProcess.validate(UserSchema, example3);

  console.log(JSON.stringify(result, null, 2));
})();
