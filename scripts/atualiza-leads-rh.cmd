@echo off
REM Roda a atualizacao local dos leads de RH e guarda um log.
REM Chamado pela tarefa agendada do Windows "Pure Hub - Leads RH".
cd /d "%~dp0.."
node scripts\atualiza-leads-rh.mjs >> "%TEMP%\pure-hub-leads-rh.log" 2>&1
