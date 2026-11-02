import * as v from 'valibot'

const UserSchema = v.object({
  id: v.number(),
  name: v.string(),
  age: v.number(),
  email: v.string(),
})

export const CreateUserSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  age: v.pipe(v.number(), v.integer(), v.minValue(0)),
  email: v.pipe(v.string(), v.email()),
})

export const UserIdParamSchema = v.object({
  id: v.pipe(
    v.string(),
    v.transform((value) => Number(value)),
    v.number(),
    v.integer(),
    v.minValue(1),
  ),
})

export const usersListResponseSchema = v.object({
  users: v.array(UserSchema),
})

export const userResponseSchema = v.object({
  user: UserSchema,
})

export const problemResponseSchema = v.object({
  error: v.string(),
})

export type UsersListResponse = v.InferOutput<typeof usersListResponseSchema>
export type UserResponse = v.InferOutput<typeof userResponseSchema>
