import * as v from 'valibot'

const UserSchema = v.object({
    id: v.number(),
    name: v.string(),
    age: v.number(),
    email: v.string(),
})

export const responseSchema = v.object({ users: v.array(UserSchema) })

export type ResponseSchemaType = v.InferOutput<typeof responseSchema>