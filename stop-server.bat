@echo off
echo Arret du serveur CRM CarWazPlan...
pm2 stop crm-carwazplan-backend
pm2 delete crm-carwazplan-backend
echo Serveur arrete.
pause
