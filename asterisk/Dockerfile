FROM ubuntu:16.04

RUN apt-get -y update
RUN apt-get -y install git build-essential subversion libncurses5-dev libssl-dev libxml2-dev libsqlite3-dev uuid-dev vim-nox ncurses-dev uuid-dev libjansson-dev libxml2-dev sqlite libsqlite3-dev libjansson-dev curl

# download asterisk
WORKDIR /tmp
RUN git clone -b certified/13.8 --depth 1 https://gerrit.asterisk.org/asterisk
WORKDIR /tmp/asterisk

# make asterisk
RUN ./configure
RUN make menuselect.makeopts
RUN menuselect/menuselect \
  --disable BUILD_NATIVE \
  --enable chan_sip \
  menuselect.makeopts

# Continue with a standard make
RUN make 1> /dev/null
RUN make install 1> /dev/null
RUN make samples 1> /dev/null
COPY conf/sip.conf /etc/asterisk
COPY conf/http.conf /etc/asterisk
COPY conf/ari.conf /etc/asterisk
COPY conf/extensions.conf /etc/asterisk

CMD asterisk -f

