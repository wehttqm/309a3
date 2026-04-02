#!/bin/bash

npx prisma migrate reset -f
npm run seed