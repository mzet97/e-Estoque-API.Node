import { Request, Response, NextFunction } from 'express'
import { ODataParserService, ODataQuery } from './ODataParser'
import { injectable, inject } from 'tsyringe'

declare global {
  namespace Express {
    interface Request {
      oDataQuery?: ODataQuery
    }
  }
}

@injectable()
export class ODataMiddleware {
  constructor(
    @inject(ODataParserService.name)
    private oDataParser: ODataParserService,
  ) {}

  execute = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const queryString = req.url.split('?')[1]
      
      if (!queryString) {
        return next()
      }

      const oDataQuery = this.oDataParser.parse(queryString)

      if (oDataQuery) {
        req.oDataQuery = oDataQuery
        console.log('OData Query parsed:', JSON.stringify(oDataQuery, null, 2))
      }

      next()
    } catch (error) {
      console.error('Error parsing OData query:', error)
      res.status(400).json({
        success: false,
        message: 'Invalid OData query syntax',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

export default ODataMiddleware
