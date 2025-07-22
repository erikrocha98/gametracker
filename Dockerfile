FROM php:8.2-apache

# Instalar extensões PHP necessárias
RUN apt-get update && apt-get install -y \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    pdo \
    pdo_mysql \
    mysqli \
    gd \
    zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Habilitar mod_rewrite do Apache
RUN a2enmod rewrite

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar o DocumentRoot para a pasta public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public

# Copiar configuração customizada do Apache
COPY docker/apache/apache.conf /etc/apache2/sites-available/000-default.conf

# Copiar configuração customizada do PHP (se tiver)
# COPY docker/php/php.ini /usr/local/etc/php/php.ini

# Definir diretório de trabalho
WORKDIR /var/www/html

# Copiar arquivos do projeto (em produção)
# COPY . /var/www/html

# Ajustar permissões
RUN chown -R www-data:www-data /var/www/html

# Expor porta 80
EXPOSE 80

# O Apache já inicia automaticamente com a imagem php:apache
