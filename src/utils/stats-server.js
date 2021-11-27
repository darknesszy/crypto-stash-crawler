import fetch from 'node-fetch'
import { getToken } from './auth'

export const updateStats = (route, data, query) =>
  fetch(`${process.env.API_SERVER}/${route}/${query}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  })

// export const updateStats = (route, data, query) =>
// fetch(`${process.env.API_SERVER}/${route}?${queryString.stringify(query)}`, {
//   method: 'PUT',
//   headers: {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${getToken()}`,
//   },
//   body: JSON.stringify(data),
// })

export const createStats = (route, data) =>
  fetch(`${process.env.API_SERVER}/${route.join('/')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  })

export const printResponse = (route, res) =>
  res.status >= 200 && res.status < 300
    ? process.stdout.write(`${route} has been sent...\n`)
    : res
        .json()
        .then(msg =>
          process.stdout.write(
            `${route}: (${res.status}) ${res.statusText}\n${JSON.stringify(
              msg
            )}\n`
          )
        )
