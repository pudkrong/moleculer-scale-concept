[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# moleculer-scale
This is POC the solution that we cannot scale when there are more than 700 instances running under the same transporter due to the health check packets. Actually, it can be solved by design. All services must be groupped by its relationship once we have different funcitons, we should break new functionality to the different cluster i.e. having new set of micro services (separated transporter).

However, this POC is done to be mid-term solution because we need time to separate services into many groups.

## Concepts
1. We still need to group services into its relationship
2. Once we separate services, then we need to handle any call to the services which are separated by the step 1
3. Using middleware to hook `call` and `mcall` by using HTTP call and url pattern
4. Any events emitted from the services need to publish to the external pubsub. So, separated service groups can be subscribed and re-emit into its own group

## Usage
1. Run dependencies which are redis and kubemq using `npm run dockers`
1. Run proxy as api gateway using `npm run proxy`
1. Run service group1 using `npm run group1`
1. Run service group2 using `npm run group2`

## Testing
1. Call `call group1-1.emit` on group1
1. Call `call group2-1.emit` on group1
1. Call `call group1-1.emit` on group2
1. Call `call group2-1.emit` on group2


## Useful links
* Moleculer website: https://moleculer.services/
* Moleculer Documentation: https://moleculer.services/docs/0.14/

