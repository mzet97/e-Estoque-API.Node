import { Request, Response } from 'express'

export default interface IController {
  handle(request: Request, response: Response): Promise<void>
}
