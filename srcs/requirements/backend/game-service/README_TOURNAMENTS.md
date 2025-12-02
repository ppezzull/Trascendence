# API Tornei

## Creare un nuovo torneo con giocatori

```bash
curl -X 'POST' \
  'http://localhost:3003/api/tournaments' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Torneo di Pong",
    "game_id": 1,
    "max_players": 8,
    "min_players": 2,
    "tournament_type": "single_elimination",
    "players": [
      { "alias": "Player1", "user_id": 1 },
      { "alias": "Player2", "user_id": 2 },
      { "alias": "Player3", "user_id": 3 },
      { "alias": "Player4", "user_id": 4 }
    ]
  }'
```

Con questa chiamata, il sistema creerà automaticamente tutto il bracket del torneo:
- Per 4 giocatori: 3 partite (2 del primo turno, 1 della finale)
- Per 8 giocatori: 7 partite (4 del primo turno, 2 del secondo turno, 1 della finale)

## Avviare un torneo

```bash
curl -X 'POST' \
  'http://localhost:3003/api/tournaments/1/start' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer TOKEN'
```

## Completare una partita

Quando una partita viene completata, il sistema automaticamente:
1. Aggiorna lo stato della partita a "completed"
2. Registra il vincitore
3. Sposta automaticamente il vincitore alla partita del turno successivo

```bash
curl -X 'POST' \
  'http://localhost:3003/api/tournaments/1/matches/123/complete' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer TOKEN'
```

## Ottenere il bracket del torneo

```bash
curl -X 'GET' \
  'http://localhost:3003/api/tournaments/1/bracket' \
  -H 'accept: application/json'
```

## Novità della nuova implementazione

1. **Creazione immediata del bracket**: Tutte le partite del torneo vengono create subito alla creazione del torneo
2. **Avanzamento automatico**: Quando una partita finisce, il vincitore viene automaticamente assegnato alla partita del turno successivo
3. **Supporto per giocatori pre-registrati**: È possibile creare un torneo con tutti i giocatori già specificati
4. **Miglior gestione dei bye**: I giocatori con bye passano automaticamente al turno successivo
