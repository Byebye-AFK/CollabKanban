package com.collabKanban.Kanban.Card;

import com.collabKanban.Kanban.Response.CardResponse;

public record  CardMovedEvent(Long boardId, CardResponse res){}
