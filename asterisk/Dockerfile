FROM ubuntu:14.04.3

RUN apt-get -y update
RUN apt-get -y install build-essential subversion libncurses5-dev libssl-dev libxml2-dev libsqlite3-dev uuid-dev vim-nox ncurses-dev uuid-dev libjansson-dev libxml2-dev sqlite libsqlite3-dev libjansson-dev curl

# download asterisk
RUN curl -sf -o /tmp/asterisk.tar.gz -L http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-13-current.tar.gz

# gunzip asterisk
RUN mkdir /tmp/asterisk
RUN tar -zxf /tmp/asterisk.tar.gz -C /tmp/asterisk --strip-components=1
WORKDIR /tmp/asterisk

# make asterisk
RUN ./configure
RUN make menuselect.makeopts
RUN sed -i "s/BUILD_NATIVE//" menuselect.makeopts
# Continue with a standard make
RUN make 1> /dev/null
RUN make install 1> /dev/null
RUN make samples 1> /dev/null
WORKDIR /

ADD modules.conf /etc/asterisk

CMD asterisk -f

