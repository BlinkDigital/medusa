import {Customer} from '@medusajs/medusa'

declare const __BASE__: string | undefined

export declare module "@medusajs/medusa" {
  interface User {
    customers: Customer[]
  }
}
