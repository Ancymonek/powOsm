FROM nikolaik/python-nodejs:python3.9-nodejs15

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libgeos-dev=3.7.1-1 \
    libgeos-3.7.1=3.7.1-1 \
    libgeos-c1v5=3.7.1-1 \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# TODO: properly install packages in the image
# COPY static/package.json static/package-lock.json ./
# RUN npm install
