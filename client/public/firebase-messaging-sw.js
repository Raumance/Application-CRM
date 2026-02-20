/* eslint-disable no-restricted-globals */
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyD3quqr1_ToMYwRArdDnnpLBR98Q9yfVjI',
  authDomain: 'crm-application-e8c6c.firebaseapp.com',
  projectId: 'crm-application-e8c6c',
  storageBucket: 'crm-application-e8c6c.firebasestorage.app',
  messagingSenderId: '200472744153',
  appId: '1:200472744153:web:f4e027c3a2dcaf803e6ec8',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  const options = {
    body: body || 'Nouvelle notification',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: payload.data?.tag || 'crm-notification',
    data: payload.data || {},
  }
  self.registration.showNotification(title || 'CRM CarWazPlan', options)
})
