FROM python:3

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .


CMD [ "gunicorn","--bind","0.0.0.0:8000", "main:app"]

EXPOSE 8000
