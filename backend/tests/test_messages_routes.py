def test_send_message_to_self_rejected(client, auth_headers, sample_user):
    response = client.post(
        '/api/messages/send',
        headers=auth_headers,
        json={'receiver_id': sample_user.id, 'content': 'hello me'},
    )

    assert response.status_code == 400
    assert response.json['error'] == 'Cannot send message to yourself'


def test_send_message_and_mark_read_flow(client, auth_headers, employer_headers, sample_user, sample_employer):
    send_response = client.post(
        '/api/messages/send',
        headers=auth_headers,
        json={'receiver_id': sample_employer.user_id, 'content': 'hello employer'},
    )

    assert send_response.status_code == 201

    unread_before = client.get('/api/messages/unread/count', headers=employer_headers)
    assert unread_before.status_code == 200
    assert unread_before.json['unread_count'] == 1

    conversation = client.get(f'/api/messages/conversations/{sample_user.id}', headers=employer_headers)
    assert conversation.status_code == 200
    assert len(conversation.json) == 1
    assert conversation.json[0]['content'] == 'hello employer'

    unread_after = client.get('/api/messages/unread/count', headers=employer_headers)
    assert unread_after.status_code == 200
    assert unread_after.json['unread_count'] == 0


def test_get_conversations_and_messageable_users(client, auth_headers, employer_headers, sample_user, sample_employer):
    sent = client.post(
        '/api/messages/send',
        headers=employer_headers,
        json={'receiver_id': sample_user.id, 'content': 'hello worker'},
    )
    assert sent.status_code == 201

    conversations_response = client.get('/api/messages/conversations', headers=auth_headers)
    assert conversations_response.status_code == 200
    assert len(conversations_response.json) >= 1
    assert any(item['other_user']['id'] == sample_employer.user_id for item in conversations_response.json)

    users_response = client.get('/api/messages/users', headers=auth_headers)
    assert users_response.status_code == 200
    ids = [user['id'] for user in users_response.json]
    assert sample_user.id not in ids
    assert sample_employer.user_id in ids


def test_mark_conversation_read_endpoint(client, auth_headers, employer_headers, sample_user, sample_employer):
    sent = client.post(
        '/api/messages/send',
        headers=employer_headers,
        json={'receiver_id': sample_user.id, 'content': 'please read this'},
    )
    assert sent.status_code == 201

    response = client.put(f'/api/messages/conversations/{sample_employer.user_id}/mark-read', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['message'] == 'Conversation marked as read'

    unread = client.get('/api/messages/unread/count', headers=auth_headers)
    assert unread.status_code == 200
    assert unread.json['unread_count'] == 0
