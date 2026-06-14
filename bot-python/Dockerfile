FROM python:3.12-slim

WORKDIR /app

COPY bot-python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot-python/ .

EXPOSE 8080

CMD ["python", "bot.py"]
