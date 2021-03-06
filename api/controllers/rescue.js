var _, Rescue, rescue, save, winston





_ = require( 'underscore' )
winston = require( 'winston' )
Rescue = require( '../models/rescue' )
ErrorModels = require( '../errors' )





// GET
// =============================================================================
exports.get = function ( request, response ) {
  var filter, id, query, responseModel

  responseModel = {
    links: {
      self: request.originalUrl
    }
  }

  if ( id = request.params.id ) {
    Rescue
    .findById( id )
    .exec( function ( error, rescue ) {
      var status

      if ( error ) {
        responseModel.errors = []
        responseModel.errors.push( error )
        status = 400

      } else {
        responseModel.data = rescue
        status = 200
      }

      response.status( status )
      response.json( responseModel )
    })

  } else {
    filter = {}
    query = {}
    responseModel = {
      links: {
        self: request.originalUrl
      }
    }

    filter.size = parseInt( request.body.limit ) || 25
    delete request.body.limit

    filter.from = parseInt( request.body.offset ) || 0
    delete request.body.offset

    for ( var key in request.body ) {
      if ( key === 'q' ) {
        query.query_string = {
          query: request.body.q
        }
      } else {
        if ( !query.bool ) {
          query.bool = {
            should: []
          }
        }

        term = {}
        term[key] = {
          query: request.body[key],
          fuzziness: 'auto'
        }
        query.bool.should.push( { match: term } )
      }
    }

    if ( !Object.keys( query ).length ) {
      query.match_all = {}
    }

    Rescue.search( query, filter, function ( error, data ) {
      if ( error ) {
        responseModel.errors = []
        responseModel.errors.push( error )
        status = 400

      } else {
        responseModel.meta = {
          count: data.hits.hits.length,
          limit: filter.size,
          offset: filter.from,
          total: data.hits.total
        }
        responseModel.data = []

        data.hits.hits.forEach( function ( hit, index, hits ) {
          hit._source._id = hit._id
          hit._source.score = hit._score
          responseModel.data.push( hit._source )
        })
        status = 200
      }

      response.status( status )
      response.json( responseModel )
    })
  }
}





// POST
// =============================================================================
exports.post = function ( request, response ) {
  var responseModel

  responseModel = {
    links: {
      self: request.originalUrl
    }
  }

  Rescue.create( request.body, function ( error, rescue ) {
    var errors, errorTypes, status

    if ( error ) {
      errorTypes = Object.keys( error.errors )
      responseModel.errors = []

      for ( var i = 0; i < errorTypes.length; i++ ) {
        var error, errorModel, errorType

        errorType = errorTypes[i]
        error = error.errors[errorType].properties

        if ( error.type === 'required' ) {
          errorModel = ErrorModels['missing_required_field']
        }

        errorModel.detail = 'You\'re missing the required field: ' + error.path

        responseModel.errors.push( errorModel )
      }

      winston.error( error )
      status = 400

    } else {
      responseModel.data = rescue
      status = 201
    }

    if ( referer = request.get( 'Referer' ) ) {
      response.redirect( '/login' )

    } else {
      response.status( status )
      response.json( responseModel )
    }
  })

  return rescue
}





// PUT
// =============================================================================
exports.put = function ( request, response ) {
  var responseModel, status

  responseModel = {
    links: {
      self: request.originalUrl
    }
  }

  if ( id = request.params.id ) {
    Rescue.findById( id, function ( error, rescue ) {
      if ( error ) {
        responseModel.errors = responseModel.errors || []
        responseModel.errors.push( error )
        response.status( 400 )
        return response.json( responseModel )

      } else if ( !rescue ) {
        return response.status( 404 ).send()
      }

      for ( var key in request.body ) {
        if ( key === 'client' ) {
          _.extend( rescue.client, request.body[key] )
        } else {
          rescue[key] = request.body[key]
        }
      }

//      rescue.increment()
      rescue.save( function ( error, rescue ) {
        var errors, errorTypes, status

        if ( error ) {

          errorTypes = Object.keys( error.errors )
          responseModel.errors = []

          for ( var i = 0; i < errorTypes.length; i++ ) {
            var error, errorModel, errorType

            errorType = errorTypes[i]
            error = error.errors[errorType].properties

            if ( error.type === 'required' ) {
              errorModel = ErrorModels['missing_required_field']
            }

            errorModel.detail = 'You\'re missing the required field: ' + error.path

            responseModel.errors.push( errorModel )
          }

          status = 400

        } else {
          status = 200
          responseModel.data = rescue
        }

        response.status( status )
        response.json( responseModel )
      })
    })
  } else {
    response.status( 400 )
    response.send()
  }

  return rescue
}
