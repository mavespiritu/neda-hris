@echo off
cd /d "D:\xampp\htdocs\hris"
php artisan queue:work
pause
